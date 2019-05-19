import React from 'react';

const Web3Utils = require('web3-utils');

const poiTaggerAbi = require('../abi/PoiTaggerAbi');

class LandingPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      sampleAddress: '0x518C5dAC72Ac7AB1b3E611b84A1C716640ccd6B1',
      poiTaggerAddress: '0xbe516fBCb80a9783ef60fd4EE8DA82C479a2A868',
      tags: [],
      tagsGasUsed: {},
      tagsTotalGasUsed: 0,
      tagsUncompressed: [],
      tagsUncompressedGasUsed: {},
      tagsUncompressedTotalGasUsed: 0,
      delta: 0,
    };

    this.handleChange = this.handleChange.bind(this);
    this.submit = this.submit.bind(this);
    this.getTags = this.getTags.bind(this);
    this.getTagsUncompressed = this.getTagsUncompressed.bind(this);
  }

  componentDidMount() {
    if (window.ethereum) {
      window.web3 = new Web3(ethereum);
      try {
        // Request account access if needed
        console.log('window.ethereum');
        ethereum.enable();
      } catch (error) {
        // User denied account access...
      }
    } else if (window.web3) {
      window.web3 = new Web3(web3.currentProvider);
      console.log('window.currentProvider');
      // Acccounts always exposed
    }
    const contract = web3.eth.contract(poiTaggerAbi);
    this.contract = contract.at(this.state.poiTaggerAddress);
    this.utils = Web3Utils;

    this.getTags();
    this.getTagsUncompressed();
  }

  getTags() {
    this.contract.getTags.call(this.state.sampleAddress, (err, tagsData) => {
      const tags = tagsData ? tagsData.map(tag => this.utils.toUtf8(tag)) : [];
      this.setState({ tags });
    });
  }

  getTagsUncompressed() {
    this.contract.getTagsUncompressed.call(this.state.sampleAddress, (err, tagsData) => {
      const tags = tagsData ? tagsData.map(tag => this.utils.toUtf8(tag)) : [];
      this.setState({ tagsUncompressed: tags });
    });
  }

  getTxnReceipt(id, id2, tag) {
    const {
      tagsGasUsed,
      tagsUncompressedGasUsed,
      tagsTotalGasUsed,
      tagsUncompressedTotalGasUsed,
    } = this.state;
    web3.eth.getTransactionReceipt(id, (e, receipt) => {
      if (e) return console.log(e);
      const cummulative = tagsTotalGasUsed + receipt.gasUsed;
      tagsGasUsed[tag] = receipt.gasUsed;
      this.setState({
        tagsTotalGasUsed: tagsTotalGasUsed + receipt.gasUsed,
        delta: Math.abs((cummulative / tagsUncompressedTotalGasUsed) - 1),
      });
      return true;
    });
    web3.eth.getTransactionReceipt(id2, (e, receipt) => {
      if (e) return console.log(e);
      const cummulative = tagsUncompressedTotalGasUsed + receipt.gasUsed;
      tagsUncompressedGasUsed[tag] = receipt.gasUsed;
      this.setState({
        tagsUncompressedTotalGasUsed: cummulative,
        delta: Math.abs((tagsTotalGasUsed / tagsUncompressedTotalGasUsed) - 1),
      });
      return true;
    });
  }

  submit() {
    const { accounts } = web3.eth;
    const {
      sampleAddress,
      address,
      tag,
    } = this.state;
    const contentAddressToTag = address || sampleAddress;
    this.contract.addTag(
      contentAddressToTag,
      this.utils.fromAscii(tag),
      { from: accounts[0] },
      (err, result) => {
        this.contract.addTagUncompressed(
          contentAddressToTag,
          this.utils.fromAscii(tag),
          { from: accounts[0] },
          (err2, result2) => {
            setTimeout(() => {
              this.getTags();
              this.getTagsUncompressed();
            }, 1500);
            this.getTxnReceipt(result, result2, tag);
          },
        );
      },
    );
  }

  handleChange(evt) {
    const { name, value } = evt.target;
    this.setState({
      [name]: value,
    });
  }

  render() {
    const {
      sampleAddress,
      tags,
      tagsGasUsed,
      tagsUncompressed,
      tagsUncompressedGasUsed,
      tagsTotalGasUsed,
      tagsUncompressedTotalGasUsed,
      delta,
    } = this.state;
    return (
      <div className="landing-page">
        <div><span role="img" aria-label="hey">👋</span> Hello</div>
        <div className="form-wrapper">
          <input name="address" readOnly value={sampleAddress} onChange={this.handleChange} />
          <br />
          <input name="tag" onChange={this.handleChange} />
          <br />
          <button type="submit" onClick={this.submit}>Submit</button>
        </div>
        <p>Gas savings: <b>{(delta * 100).toFixed(0)}%</b></p>
        <p>Total gas used compressed: <b>{tagsTotalGasUsed}</b></p>
        <p>Total gas used uncompressed: <b>{tagsUncompressedTotalGasUsed}</b></p>
        <ul className="tags">
          {tags && tags.map((tag, i) => (
            <li key={`_${i + 1}`}><b>{tag}</b> {tagsGasUsed[tag] ? `-- gas used ---> ${tagsGasUsed[tag]}` : ''}</li>
          ))}
        </ul>
        <ul className="tags tags-uncompressed" style={{ background: '#e3e3e3' }}>
          {tagsUncompressed && tagsUncompressed.map((tag, i) => (
            <li key={`__${i + 1}`}><b>{tag}</b> {tagsUncompressedGasUsed[tag] ? `-- gas used ---> ${tagsUncompressedGasUsed[tag]}` : ''}</li>
          ))}
        </ul>
      </div>
    );
  }
}

export default LandingPage;
